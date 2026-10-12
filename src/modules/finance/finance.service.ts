import prisma from "../../config/prisma";

export const createTuitionConfig = async (data: any) => {
    return prisma.tuitionFeeConfig.create({ data });
};

export const getTuitionConfigs = async () => {
    return prisma.tuitionFeeConfig.findMany({ include: { major: true } });
};

export const generateInvoice = async (data: { studentId: string, academicYear: string, semester: number, dueDate: string }) => {
    const { studentId, academicYear, semester, dueDate } = data;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new Error("Student not found");

    // 1. Find applicable tuition config
    let config = await prisma.tuitionFeeConfig.findFirst({
        where: { academicYear, semester, majorId: student.majorId, cohort: student.cohort }
    });

    if (!config) {
        // Fallback to generic config
        config = await prisma.tuitionFeeConfig.findFirst({
            where: { academicYear, semester, majorId: null, cohort: null }
        });
    }
    
    if (!config) throw new Error("No tuition configuration found for this semester");

    // 2. Calculate Total Credits from enrolled classes
    const enrolledClasses = await prisma.classStudent.findMany({
        where: {
            studentId,
            registrationStatus: "ENROLLED",
            class: { academicYear, semester }
        },
        include: { class: { include: { course: true } } }
    });

    const totalCredits = enrolledClasses.reduce((sum, cls) => sum + cls.class.course.credits, 0);
    const tuitionAmount = totalCredits * config.pricePerCredit;

    // Optional: Add other mandatory fees (BHYT, etc.)
    const healthInsurance = 750000;
    const totalAmount = tuitionAmount + healthInsurance;

    // 3. Create Invoice
    return prisma.$transaction(async (tx) => {
        // Check if invoice already exists
        const existing = await tx.invoice.findFirst({
            where: { studentId, academicYear, semester }
        });
        if (existing) throw new Error("Invoice already generated for this semester");

        const invoice = await tx.invoice.create({
            data: {
                studentId,
                academicYear,
                semester,
                dueDate: new Date(dueDate),
                totalAmount,
                status: "UNPAID"
            }
        });

        // Add Items
        await tx.invoiceItem.createMany({
            data: [
                { invoiceId: invoice.id, description: "Học phí tín chỉ", amount: tuitionAmount, type: "TUITION" },
                { invoiceId: invoice.id, description: "Bảo hiểm y tế", amount: healthInsurance, type: "HEALTH_INSURANCE" }
            ]
        });

        return tx.invoice.findUnique({ where: { id: invoice.id }, include: { items: true } });
    });
};

export const getInvoicesByStudent = async (studentId: string) => {
    return prisma.invoice.findMany({
        where: { studentId },
        include: { items: true, payments: true }
    });
};

export const processPayment = async (data: { invoiceId: string, amount: number, paymentMethod: any, transactionRef?: string }, collectedById?: string) => {
    return prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
        if (!invoice) throw new Error("Invoice not found");
        if (invoice.status === "PAID") throw new Error("Invoice is already fully paid");

        // Create transaction
        const payment = await tx.paymentTransaction.create({
            data: {
                invoiceId: invoice.id,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                transactionRef: data.transactionRef,
                collectedById
            }
        });

        // Update Invoice
        const newPaidAmount = invoice.paidAmount + data.amount;
        let newStatus: "UNPAID" | "PARTIAL" | "PAID" = "PARTIAL";
        
        if (newPaidAmount >= invoice.totalAmount) {
            newStatus = "PAID";
        }

        await tx.invoice.update({
            where: { id: invoice.id },
            data: {
                paidAmount: newPaidAmount,
                status: newStatus
            }
        });

        return payment;
    });
};

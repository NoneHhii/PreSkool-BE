import 'dotenv/config';
import prisma from '../src/config/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
    const adminEmail = 'admin@preskool.com';
    const adminUsername = 'admin';
    const adminPassword = 'adminpassword123'; // Đổi mật khẩu này theo ý bạn

    const existingAdmin = await prisma.user.findFirst({
        where: {
            OR: [
                { email: adminEmail },
                { username: adminUsername }
            ]
        }
    });

    if (existingAdmin) {
        console.log('Admin account already exists.');
        return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.$transaction(async (tx: any) => {
        const newAdmin = await tx.user.create({
            data: {
                username: adminUsername,
                email: adminEmail,
                passwordHash: passwordHash,
                role: 'ADMIN',
                status: 'ACTIVE'
            }
        });

        await tx.userProfile.create({
            data: {
                userId: newAdmin.id,
                fullName: 'System Administrator',
                phone: '0123456789'
            }
        });

        return newAdmin;
    });

    console.log('✅ Admin account created successfully!');
    console.log('Username:', admin.username);
    console.log('Email:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

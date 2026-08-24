import multer from "multer";

const storage =
    multer.memoryStorage();

export const uploadExcel =
    multer({
        storage,

        limits: {
            fileSize: 5 * 1024 * 1024,
        },

        fileFilter: (
            req,
            file,
            cb
        ) => {
            const allowedExtensions = [
                ".xlsx",
                ".xls",
            ];

            const extension =
                file.originalname
                    .toLowerCase()
                    .slice(
                        file.originalname
                            .lastIndexOf(".")
                    );

            if (
                !allowedExtensions.includes(
                    extension
                )
            ) {
                return cb(
                    new Error(
                        "Only Excel files are allowed"
                    )
                );
            }

            cb(null, true);
        },
    });
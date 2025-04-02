import { z } from 'zod';


export const formSchema = z.object({
    e_bill_file: z.instanceof(File).optional(),
    name: z.string().min(2, {
        message: "Name must be at least 2 characters long.",
    }),
    phoneNumber: z.string().regex(/^\d{10}$/, {
        message: "Phone number must be a 10-digit number.",
    }),
    email: z.string().email({
        message: "A valid email address is required.",
    }).min(2, {
        message: "Email must be at least 2 characters long.",
    }),
    quoteType: z.enum([
        "On Grid Residential (Subsidy)",
        "On Grid",
        "Hybrid",
        "Solar pump",
        "Street Light",
    ], {
        message: "Please select a valid quote type.",
    }),
    roofType: z.enum([
        "RCC (Reinforced Cement Concrete)",
        "Sheeted",
    ], {
        message: "Please select a valid roof type.",
    }),
    structureType: z.enum([
        "Pre Galvanized Structure - RCC",
        "High Rised Structure - RCC",
        "Mini Rail Structure - Sheeted",
    ], {
        message: "Please select a valid structure type.",
    }),
   
});
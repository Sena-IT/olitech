export interface Option {
    value: string;
    label: string;
  }
  
  export interface UserFormFieldType {
    name: "e_bill_file" | "name" | "email" | "phoneNumber" | "quoteType" | "structureType" | "roofType" ;
    placeholder: string;
    type: string;
    label: string;
    description: string;
    options?: Option[];
    navDetail?:string
  }
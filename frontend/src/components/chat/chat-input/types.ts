import { SetStateAction } from "react"

export type ChatInputboxType={
    classname?:string
    placeholder:string
    setOpenfeedback?:React.Dispatch<SetStateAction<boolean>>
    feedback?:boolean
}
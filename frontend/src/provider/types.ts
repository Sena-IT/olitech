import { SetStateAction } from "react"

export type ChatContextProviderType={
    chatResponse:ChatResponseType[]
    setChatResponse:React.Dispatch<SetStateAction<ChatResponseType[]>>
    setDoc:React.Dispatch<SetStateAction<boolean>>
    doc:boolean
    queryLoading:boolean
    setQueryLoading:React.Dispatch<SetStateAction<boolean>>
}


export type ChatResponseType={
    message:string
    sender:'bot'|'user',
    map?:boolean,
    classifier?:string
}
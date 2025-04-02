'use client'
import React, { createContext, useContext, useState } from 'react'
import { ChatContextProviderType, ChatResponseType } from './types'


const ChatContextProvider=createContext<ChatContextProviderType| null>(null)

const ChatProvider = ({children}:{children:React.ReactNode}) => {
    const [chatResponse,setChatResponse]=useState<ChatResponseType[]>([])
    const [doc,setDoc]=useState<boolean>(false)
    const [queryLoading, setQueryLoading] = useState(false);
  return (
    <ChatContextProvider.Provider value={{chatResponse,setChatResponse,doc,setDoc,queryLoading,setQueryLoading}}>
      {children}
    </ChatContextProvider.Provider>
  )
}

export default ChatProvider


export const useChatContext = (): ChatContextProviderType => {
    const context = useContext(ChatContextProvider);
    if (!context) {
      throw new Error('useChatContext must be used within a Provider');
    }
    return context;
  };
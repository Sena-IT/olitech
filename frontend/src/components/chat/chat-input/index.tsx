"use client";
import { getChatResponse } from "@/app/action";
import { useChatContext } from "@/provider/ChatProvider";
import React, { useState, useEffect } from "react";
import { LuSend } from "react-icons/lu";
import { ChatInputboxType } from "./types";
import { VscLoading } from "react-icons/vsc";
import { ChatResponseType } from "@/provider/types";
import { TbPaperclip } from "react-icons/tb";
import { GrClose } from "react-icons/gr";

const ChatInputBox: React.FC<ChatInputboxType> = ({
  classname,
  placeholder,
  setOpenfeedback,
  feedback,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const {
    chatResponse,
    setChatResponse,
    setDoc,
    setQueryLoading,
    queryLoading,
  } = useChatContext();
  // const [queryLoading, setQueryLoading] = useState(false);
  const [openMap, setOpenMap] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Function to handle streaming response
  const sendQuery = async () => {
    setQueryLoading(true);
    setSearchQuery("");
    const queryToSend = searchQuery;

    const formData = new FormData();
    if (searchQuery.trim() !== "") {
      formData.append("query", searchQuery);
      setChatResponse((prev) => [
        ...prev,
        { message: searchQuery, sender: "user" },
      ]);
    } else if (uploadedFile) {
      setDoc(true);
      formData.append("file", uploadedFile);
      setChatResponse((prev) => [
        ...prev,
        {
          message: "<h2 class='font-bold italic'>Document uploaded</h2>",
          sender: "user",
        },
      ]);
    }
    setUploadedFile(null);

    // try {
    //   const response = await getChatResponse(formData);

    //   if (!response?.ok) {
    //     throw new Error("Network response was not ok");
    //   }

    //   const reader = response.body.getReader();
    //   const decoder = new TextDecoder();

    //   while (true) {
    //     const { done, value } = await reader.read();
    //     if (done) {
    //       setQueryLoading(false);
    //       break;
    //     }

    //     const chunk = decoder.decode(value);
    //     const lines = chunk.split("\n\n");

    //     for (const line of lines) {
    //       if (line.startsWith("data: ")) {
    //         const data = line.replace("data: ", "");
    //         if (data === "[DONE]") {
    //           setQueryLoading(false);
    //           continue;
    //         }

    //         try {
    //           const parsedData = JSON.parse(data);

    //           if (parsedData.error) {
    //             console.error("Stream error:", parsedData.error);
    //             setChatResponse((prev) => [
    //               ...prev,
    //               { message: parsedData.error, sender: "bot", map: false },
    //             ]);
    //           } else {
    //             const { content, map, classifier, receive_pdf } = parsedData;
    //             const receive_pdf_bool = receive_pdf;
    //             setDoc(false);
    //             setOpenMap(map);

    //             if (Boolean(receive_pdf)) {

    //               const pdfInfo = JSON.parse(content);

    //               try {
    //                 const response = await fetch(
    //                   `http://127.0.0.1:8000/download-pdf?pdf_path=${encodeURIComponent(pdfInfo.pdf_path)}`,
    //                   {
    //                     method: "GET",
    //                   }
    //                 );

    //                 if (!response.ok) {
    //                   throw new Error("PDF download failed");
    //                 }
    //                 console.log("file----------->",response)
    //                 const blob = await response.blob();

    //                 const url = window.URL.createObjectURL(blob);
    //                 const link = document.createElement("a");
    //                 link.href = url;

    //                 const filename =
    //                   "downloaded.pdf";
    //                 link.setAttribute("download", filename);

    //                 document.body.appendChild(link);
    //                 link.click();
    //                 link.remove();

    //                 window.URL.revokeObjectURL(url);

    //                 setChatResponse((prev) => {
    //                   const lastMessage = prev[prev.length - 1];
    //                   if (
    //                     lastMessage.sender === "bot" &&
    //                     !lastMessage.message.includes("Document uploaded")
    //                   ) {
    //                     return [
    //                       ...prev.slice(0, -1),
    //                       {
    //                         message: "Your Document has been downloaded",
    //                         sender: "bot",
    //                         map,
    //                         classifier: classifier,
    //                       },
    //                     ];
    //                   }

    //                   return [
    //                     ...prev,
    //                     {
    //                       message: "Your Document has been download",
    //                       sender: "bot",
    //                       map,
    //                       classifier: classifier,
    //                     },
    //                   ];
    //                 });
    //                 return ;
    //               } catch (error) {
    //                 console.log(error);
    //               }
    //             }

    //             setChatResponse((prev) => {
    //               const lastMessage = prev[prev.length - 1];
    //               if (
    //                 lastMessage.sender === "bot" &&
    //                 !lastMessage.message.includes("Document uploaded")
    //               ) {
    //                 return [
    //                   ...prev.slice(0, -1),
    //                   {
    //                     message: content,
    //                     sender: "bot",
    //                     map,
    //                     classifier: classifier,
    //                   },
    //                 ];
    //               }

    //               return [
    //                 ...prev,
    //                 {
    //                   message: content,
    //                   sender: "bot",
    //                   map,
    //                   classifier: classifier,
    //                 },
    //               ];
    //             });
    //           }
    //         } catch (error) {
    //           console.error("Error parsing stream data:", error);
    //         }
    //       }
    //     }
    //   }
    // } catch (error) {
    //   console.error("Streaming error:", error);
    //   setChatResponse((prev) => [
    //     ...prev,
    //     { message: "An error occurred", sender: "bot", map: false },
    //   ]);
    // }
    //
    try {
      const form = new FormData();

      form.append("query", searchQuery);
      const res = await getChatResponse(form);
      const data = await res?.json();
      setChatResponse((prev) => [
        ...prev,
        { message: data?.data, sender: "bot", map: false },
      ]);
    } catch (error) {
      console.log(error);
    } finally {
      setQueryLoading(false);
    }
  };

  const keyPressFunc = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendQuery();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setUploadedFile(event.target.files[0]);
    }
  };

  return (
    <React.Fragment>
      {uploadedFile && (
        <div className="w-full py-4 ring-1 ring-gray-100 bg-neutral-100/60 rounded-xl px-4 my-2 relative">
          <div className="flex flex-row space-x-2 items-start h-full">
            <div className="rounded-lg h-12 px-1.5 py-3 bg-red-100 flex flex-row items-center justify-center">
              <h2 className="text-md font-bold text-red-600">PDF</h2>
            </div>
            <h2 className="text-[12px] italic mt-1.5">{uploadedFile.name}</h2>
          </div>
          <button
            onClick={() => {
              setUploadedFile(null);
            }}
            className="absolute rounded-full top-2 right-2 bg-neutral-200 h-5 w-5 flex flex-row items-center justify-center"
          >
            <GrClose className="w-2 h-2 text-neutral-600" />
          </button>
        </div>
      )}
      <div
        className={`rounded-xl shadow bg-white h-12 ring-1 ring-neutral-200/80 flex-row flex items-center space-x-4 px-4 ${classname}`}
      >
        <input
          placeholder={placeholder}
          className="flex-1 rounded-2xl outline-0 bg-transparent py-4 size-full placeholder:text-neutral-500 placeholder:font-normal text-neutral-800 font-medium text-[14px]"
          onChange={(e) => setSearchQuery(e.target.value)}
          value={searchQuery}
          disabled={queryLoading}
          onKeyDown={keyPressFunc}
        />
        {queryLoading ? (
          <VscLoading className="w-5 h-5 text-neutral-800 animate-spin" />
        ) : (
          <div className="flex flex-row items-center space-x-4">
            <button onClick={sendQuery}>
              <LuSend className="text-neutral-800/80 w-5 h-5" />
            </button>
            <label className="cursor-pointer">
              <TbPaperclip className="text-neutral-800/80 w-5 h-5" />
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default ChatInputBox;

"use client";
import { useChatContext } from "@/provider/ChatProvider";
import { ChatResponseType } from "@/provider/types";
import React, { useEffect, useState } from "react";
import ChatInputBox from "../chat-input";
import { LuThumbsUp, LuThumbsDown } from "react-icons/lu";
import { ReactTyped } from "react-typed";
import he from "he";
import GoogleMapContainer from "@/components/map/MapContainer";

const ChatMessage = ({
  chat,
  doc,
}: {
  chat: ChatResponseType;
  doc: boolean;
}) => {
  const [textContent, setTextContent] = useState("");
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    if (
      chat?.message &&
      chat?.sender !== "user" 
    ) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(he.decode(chat.message), "text/html");

      const extractedHTML = Array.from(doc.body.childNodes)
        .map((node: ChildNode) => {
          if (node instanceof Element) {
            return node.outerHTML;
          } else {
            return node.textContent || "";
          }
        })
        .join("");
      console.log(extractedHTML);
      setTextContent(extractedHTML);
    }
  }, [chat?.message]);


  return (
    <>
      {textContent || !isTypingDone ? (
        <ReactTyped
          strings={[textContent]}
          typeSpeed={0}
          backSpeed={0}
          loop={false}
          showCursor={false}
          onComplete={() => setIsTypingDone(true)}
        />
      ) : (
        <div
          dangerouslySetInnerHTML={{ __html: chat?.message }}
          className="prose prose-sm w-full"
        />
      )}
    </>
  );
};

const ChatWindow = () => {
  const { chatResponse, doc } = useChatContext();
  const [openFeedback, setOpenfeedback] = useState(false);
  const [goodFeedback, setGoodFeedback] = useState(false);

  console.log(chatResponse);

  useEffect(() => {
    if (openFeedback) setOpenfeedback(false);
    if (goodFeedback) setGoodFeedback(false);
  }, [chatResponse]);

  const handleGoodFeedback = () => {
    setGoodFeedback(true);
    setOpenfeedback(false);
  };

  const handleOpenFeedback = () => {
    setOpenfeedback(true);
    setGoodFeedback(false);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto flex flex-col-reverse space-y-6 pb-3">
      <div>
        <div className="my-2 w-full bg-neutral-100 h-[120px] flex-col flex justify-center rounded-xl px-4 py-3">
          <h2 className="text-neutral-800 text-lg font-semibold">
            Welcome to GSONS
          </h2>
          <p className="mt-1.5 text-neutral-500 font-normal text-[13px]">
            I'm your friendly AI Assistant, here to help with your queries
          </p>
        </div>
        {chatResponse.length !== 0 && (
          <React.Fragment>
            {chatResponse.map((chat: ChatResponseType, i) => (
              <React.Fragment key={i}>
                <div
                  className={`py-2 w-full flex ${
                    chat.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        chat.sender === "user"
                          ? "bg-neutral-100 text-black w-fit"
                          : "bg-neutral-800 text-white w-fit"
                      }`}
                    >
                      <ChatMessage chat={chat} doc={doc} />
                    </div>
                
                </div>
                {chat?.map && <GoogleMapContainer />}
                {/* Feedback buttons (uncomment if needed) */}
                {/* {i === chatResponse.length - 1 && chat?.sender === "bot" && (
                  <div className="mr-2 flex items-end justify-end space-x-4">
                    <button
                      onClick={handleGoodFeedback}
                      className={`${goodFeedback ? "bg-blue-500 text-white w-6 h-6 flex items-center rounded-full justify-center" : ""}`}
                    >
                      <LuThumbsUp
                        className={`${goodFeedback ? "text-white w-[16px] h-[16px] p-0.5" : "text-neutral-800 w-[18px] h-[18px]"}`}
                      />
                    </button>
                    <button
                      onClick={handleOpenFeedback}
                      className={`${openFeedback ? "bg-neutral-800 text-white w-6 h-6 flex items-center rounded-full justify-center" : ""}`}
                    >
                      <LuThumbsDown
                        className={`${openFeedback ? "text-neutral-300 w-[18px] h-[18px] p-0.5" : "text-neutral-800 w-[18px] h-[18px]"}`}
                      />
                    </button>
                  </div>
                )}
                {i === chatResponse.length - 1 && openFeedback && (
                  <ChatInputBox
                    classname="w-1/2"
                    placeholder="send your feedback"
                    setOpenfeedback={setOpenfeedback}
                    feedback={openFeedback}
                  />
                )} */}
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;

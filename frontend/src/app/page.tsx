import ChatInputBox from "@/components/chat/chat-input";
import ChatWindow from "@/components/chat/chat-window";
import UserDetailsForm from "@/components/form";


export default function Home() {
  return (
    <div className="size-full flex items-center justify-center">
      <div className="size-full py-6 px-4 flex flex-row items-start space-x-6">
        <div className="flex-1 h-full">
          <div className="size-full flex flex-col items-center justify-between space-y-4">
            <ChatWindow/>

            <ChatInputBox placeholder="ask your query" classname="w-full"/>
          </div>
        </div>

        <div className="w-1/3 h-full overflow-y-auto">
          <UserDetailsForm/>
        </div>
      </div>
    </div>
  );
}

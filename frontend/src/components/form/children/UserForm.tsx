"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { formSchema } from "../schema";
import { AiOutlineLoading } from "react-icons/ai";
import { z } from "zod";
import { UserFormFieldType } from "../type";
import userformfields from "../form_fields.json";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { getChatResponse, getQuote, uploadFile } from "@/app/action";
import { IoIosInformationCircle } from "react-icons/io";
import { useChatContext } from "@/provider/ChatProvider";

const UserForm = () => {
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  const [generateQuoteLoading, setGenerateQuoteLoading] =
    useState<boolean>(false);

  const [fileResponse, setFileResponse] = useState(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      quoteType: "On Grid",
      roofType: "Sheeted",
      structureType: "Mini Rail Structure - Sheeted",
      e_bill_file: undefined,
    },
  });

  const formfields: UserFormFieldType[] = userformfields as UserFormFieldType[];

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setGenerateQuoteLoading(true);
    try {
      const form = new FormData();
      form.append("name", values.name);
      form.append("phoneNumber", values.phoneNumber);
      form.append("email", values.email);
      form.append("quoteType", values.quoteType);
      form.append("roofType", values.roofType);
      form.append("structureType", values.structureType);
      form.append("total_units", fileResponse?.total_units_consumption);
      form.append("dc_current", fileResponse?.dc_current);

      const response = await getQuote(form);

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename = "downloaded.pdf";
      link.setAttribute("download", filename);

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
    } finally {
      setGenerateQuoteLoading(false);
    }
  }

  const handleFileUpload = async (file: File | undefined) => {
    setUploadLoading(true);
    if (!file) {
      setUploadLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadFile(formData);
      const data = await res?.json();
      setFileResponse(data?.data);
    } catch (error) {
      console.log(error);
    } finally {
      setUploadLoading(false);
    }
  };

  const { setChatResponse, setQueryLoading, queryLoading } = useChatContext();

  const handleChat = async (query: string) => {
    setQueryLoading(true);
    setChatResponse((prev) => [...prev, { message: query, sender: "user" }]);
    try {
      const form = new FormData();

      form.append("query", query);
      const res = await getChatResponse(form);
      const data = await res?.json();
      setChatResponse((prev) => [
        ...prev,
        { message: data?.data, sender: "bot", map: false },
      ]);
    } catch (error) {
      console.log(error)
    }
    finally{
      setQueryLoading(false)
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 w-full p-2 relative"
      >
        {generateQuoteLoading && (
          <div className="fixed flex flex-col items-start justify-center top-4 right-4 rounded-lg bg-white shadow-md h-16 py-1 px-4 w-80">
            <h2 className="text-[13px] text-neutral-600 font-medium">
              Generating your quote...
            </h2>
          </div>
        )}
        {formfields.map((fields, i) => (
          <FormField
            control={form.control}
            name={fields.name}
            key={i}
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel>{fields.label}</FormLabel>
                <FormControl>
                  {fields.type === "select" ? (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value as string}
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder={fields.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.options?.map((opt, i) => (
                          <SelectItem value={opt.value} key={i}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fields.type === "file" ? (
                    <div className="space-y-4">
                      <Input
                        type={fields.type}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          handleFileUpload(file);
                        }}
                      />
                      {uploadLoading && (
                        <div className="flex flex-row space-x-2 items-center">
                          <AiOutlineLoading className="w-3 h-3 animate-spin" />
                          <p className="text-neutral-500 text-[13px] font-normal animate-pulse">
                            uploading your document...
                          </p>
                        </div>
                      )}
                      {fileResponse && (
                        <div
                          dangerouslySetInnerHTML={{
                            __html:
                              fileResponse?.response +
                              "\n" +
                              "Please fill the below details to get the quote",
                          }}
                          className="text-neutral-500 text-[13px] font-normal"
                        />
                      )}
                    </div>
                  ) : (
                    <Input
                      type={fields.type}
                      placeholder={fields.placeholder}
                      {...field}
                    />
                  )}
                </FormControl>
                <FormMessage />
                {fields.type === "select" && (
                  <div
                    className="flex flex-row items-center space-x-1 cursor-pointer"
                    onClick={() => {
                      handleChat(fields.navDetail as string);
                    }}
                  >
                    <IoIosInformationCircle className="w-4 h-4 " />
                    <p className="text-neutral-700 font-medium text-[13px]">
                      {fields.navDetail}

                      <span className="font-bold ml-2">
                        click here to know and chat
                      </span>
                    </p>
                  </div>
                )}
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" className="w-full">
          Get Quote
        </Button>
      </form>
    </Form>
  );
};

export default UserForm;

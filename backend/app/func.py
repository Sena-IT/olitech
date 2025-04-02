from fastapi import UploadFile
from fastapi.responses import FileResponse
from app.prompts import (
    process_pdf_prompt,
    get_quote_prompt,
    get_quote_pdf_from_template,
    rag_prompt,
)
from app.schema import ConsumptionReadings
from datetime import datetime
import google.generativeai as genai
import tempfile
import re
import json
from langchain.output_parsers import PydanticOutputParser
from app.db.history import save_history
import os
import pdfkit
from fastapi.exceptions import HTTPException
from fastapi import BackgroundTasks

path_to_wkhtmltopdf = r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe"
config = pdfkit.configuration(wkhtmltopdf=path_to_wkhtmltopdf)


def process_pdf(model, thread_id, pdf_file):

    file = pdf_file.file.read()
    parser = PydanticOutputParser(pydantic_object=ConsumptionReadings)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        temp_file.write(file)
        temp_file_path = temp_file.name
    gemini_file = None
    try:
        gemini_file = genai.upload_file(
            path=temp_file_path,
            mime_type="application/pdf",
            display_name=pdf_file.filename,
        )
        current_date = datetime.now()
        year = current_date.year
        month = current_date.month

        formatted_prompt = process_pdf_prompt.format(
            month=month,
            year=year,
            format_instructions=parser.get_format_instructions(),
        )

        response = model.generate_content(
            [
                {
                    "file_data": {
                        "mime_type": gemini_file.mime_type,
                        "file_uri": gemini_file.uri,
                    }
                },
                {"text": formatted_prompt},
            ]
        )

        genai.delete_file(gemini_file.name)

        response = response.text

        cleaned_response = re.sub(r"```json|```", "", response).strip()

        formatted_json_response = json.loads(cleaned_response)

        total_consumption_units = 0
        for readings in formatted_json_response["monthly_readings"]:
            total_consumption_units += readings["units"]

        solar_recommended_AC = get_average_unit_consumption(
            units=total_consumption_units
        )

        rounded_value = round(solar_recommended_AC, 1)

        # client_data = {
        #     "total_consumptions": total_consumption_units,
        #     "dc_current_avg": rounded_value,
        # }

        res = (
            f"The total units consumed over the past 6 months are <b>{total_consumption_units}KW</b> and the average consumption is <b>{rounded_value}KW</b>."
            + "\n"
        )

        save_history(
            thread_id=thread_id,
            system_response=res,
            user_response="pdf file uploaded",
        )
        response = {
            "total_units_consumption": total_consumption_units,
            "dc_current": rounded_value,
            "response": res,
        }
        return response

    except Exception as e:

        print(f"Unexpected error: {str(e)}")
        if gemini_file:
            genai.delete_file(gemini_file.name)
            print(f"Cleaned up Gemini file due to error: {gemini_file.display_name}")
        raise Exception(f"An unexpected error occurred: {str(e)}")


def get_average_unit_consumption(units):
    avg_consumption = units / 365

    solar_recommended = avg_consumption / 4

    return solar_recommended


def get_quote_json(data, model):
    extracted_content_from_pdf = get_extracted_content()
    extracted_knowledge = extracted_content_from_pdf["knowledge_base"]
    client_data = data
    dc_current_avg = data.dc_current
    response = call_llm(
        content=extracted_knowledge,
        prompt=get_quote_prompt,
        client_data=client_data,
        DC_current=dc_current_avg,
        model=model,
    )

    return response


def get_extracted_content():
    with open(os.getenv("PRICE_LIST_KNOWLEDGE_LINK"), "r", encoding="utf-8") as file:
        json_data = json.load(file)
        return json_data


def call_llm(content, prompt, client_data, DC_current, model):
    formatted_prompt = prompt.format(
        client_data=client_data, pdf_content=content, dc_current_value=DC_current
    )

    messages = [
        {"role": "system", "content": formatted_prompt},
    ]

    llm = model

    ai_msg = llm.invoke(formatted_prompt)

    res = ai_msg.content.replace("```json", "").replace("```", "")

    return res


def getPdf(retreived_quote_system_data, user_data, model):
    extracted_html = get_extract_html()

    response = call_pdf_llm(
        data=retreived_quote_system_data,
        html=extracted_html,
        user_data=user_data,
        prompt=get_quote_pdf_from_template,
        model=model,
    )

    html_to_pdf(
        html_file_path="html_file.html",
        output_path="price_quote_pdf.pdf",
        response=response,
    )

    return "price_quote_pdf.pdf"


def get_extract_html():
    with open("price_quote_template.html", "r") as html_file:
        return html_file.read()


def call_pdf_llm(data, html, user_data, prompt, model):
    formatted_prompt = prompt.format(
        html_template=html, system_details=data, user_details=user_data
    )

    llm = model

    ai_msg = llm.invoke(formatted_prompt)

    res = ai_msg.content.replace("```html", "").replace("```", "")

    return res


def html_to_pdf(response, output_path, html_file_path):
    try:

        with open(html_file_path, "w", encoding="utf-8") as file:
            file.write(response)

        pdfkit.from_file(html_file_path, output_path, configuration=config)

        if os.path.exists(html_file_path):
            os.remove(html_file_path)

        output_file = FileResponse(
            output_path, media_type="application/pdf", filename="generated.pdf"
        )

        return output_file

    except Exception as e:
        print(f"Error converting HTML to PDF: {e}")
        return None


async def download_pdf(pdf_path):
    if not os.path.isfile(pdf_path):
        raise HTTPException(status_code=404, detail="File not found")

    response = FileResponse(
        pdf_path, media_type="application/pdf", filename=os.path.basename(pdf_path)
    )

    return response


def solar_rag(context, query, model):

    formatted_prompt = rag_prompt.format(retrieved_context=context, query=query)
    # messages =[
    #         {"role": "system","content": formatted_prompt},
    #         {"role": "user", "content": query}]
    

    ai_msg = model.invoke(formatted_prompt)
    res = ai_msg.content
    # response = json.loads(res)

    return res

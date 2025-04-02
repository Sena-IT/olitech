from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from app.schema import UploadFileSchema, GenerateQuoteSchema
from app.classes import MainModelClass
from app.func import process_pdf, get_quote_json,getPdf,download_pdf,solar_rag
from app.utils import get_thread_id
import os
import io
import asyncio
import json
from PyPDF2 import PdfReader
import aiofiles
from app.retreiver import retrieve_relevant_chunks

app = FastAPI()

load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


GEMINI_KEY = os.getenv("GEMINI_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL")
TEMPERATURE = os.getenv("TEMPERATURE")
PDF_PATH = os.getenv("PRICE_LIST_PDF_LINK")
KNOWLEDGE_BASE_PATH = os.getenv("PRICE_LIST_KNOWLEDGE_LINK")


model_class = MainModelClass(
    api_key=GEMINI_KEY, model=MODEL_NAME, temperature=TEMPERATURE
)
model = model_class.set_llm()
gen_model = model_class.set_gen_model()


@app.post("/uploadPdf")
async def UploadPdfFile(file: UploadFile = File(...)):

    content = await file.read()

    file.file.seek(0)

    content_io = io.BytesIO(content)

    upload_file = UploadFile(
        filename=file.filename,
        file=content_io,
        # content_type=file.content_type
    )

    thread_id = get_thread_id()
    response = process_pdf(model=gen_model, thread_id=thread_id, pdf_file=upload_file)
    return {"success": True, "data": response}


@app.post("/generateQuote")
async def GenerateQuote(
    name: str = Form(...),
    phoneNumber: str = Form(...),
    email: str = Form(...),
    quoteType: str = Form(...),
    roofType: str = Form(...),
    structureType: str = Form(...),
    total_units: str = Form(None),
    dc_current: str = Form(None),
):
    req = GenerateQuoteSchema(
        name=name,
        phoneNumber=phoneNumber,
        email=email,
        quoteType=quoteType,
        roofType=roofType,
        structureType=structureType,
        total_units=total_units,
        dc_current=dc_current,
    )
    response = get_quote_json(data=req,model=model)
    file_path=getPdf(model=model, retreived_quote_system_data=response, user_data=req)
    data=await download_pdf(pdf_path=file_path)
    
    return data

@app.on_event("startup")
async def startup_event():

    asyncio.create_task(initialize_knowledge_base())


async def initialize_knowledge_base():
    if not os.path.exists(KNOWLEDGE_BASE_PATH):
        print("Initializing knowledge base...")
        await read_pdf_and_create_knowledge_base(PDF_PATH, KNOWLEDGE_BASE_PATH)
    else:
        global is_initialized
        is_initialized = True
        print("Knowledge base already exists")


async def read_pdf_and_create_knowledge_base(pdf_path: str, output_path: str) -> None:

    try:

        pdf_reader = PdfReader(pdf_path)
        content = []

        for page_number, page in enumerate(pdf_reader.pages, start=1):
            text = page.extract_text()
            if text:
                content.append({"page_number": page_number, "text": text})

        async with aiofiles.open(output_path, "w") as f:
            await f.write(json.dumps({"knowledge_base": content}, indent=2))

        print(f"Knowledge base created at {output_path}")
        global is_initialized
        is_initialized = True

    except Exception as e:
        print(f"Error creating knowledge base: {str(e)}")



@app.post('/chat')
def chat_with_kb(query:str=Form(...)):
    results=retrieve_relevant_chunks(query=query,top_k=2)
    context=""
    for i, document in enumerate(results['documents'][0]):
        context+=document
    response=solar_rag(context=context,query=query,model=model)
    
    return {
        "success":True,
        "data":response
    }
    
import PyPDF2
from langchain_text_splitters import RecursiveCharacterTextSplitter
import openai
import os
from dotenv import load_dotenv
import chromadb
load_dotenv()

openai_key=os.getenv("OPENAI_KEY")

openai.api_key=openai_key

def read_pdf_contents():
    text = ""
    with open("solar_content.pdf", "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    return text


def convert_to_chunks(contents):
    chunk_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200,
    )
    
    return chunk_splitter.split_text(contents)


def convert_embeddings():
    contents = read_pdf_contents()
    chunks = convert_to_chunks(contents=contents)
    embeddings=get_embeddings(chunks=chunks)
    store_in_chromadb(chunks=chunks, embeddings=embeddings)

def get_embeddings(chunks):
    embeddings = []
    for chunk in chunks:
        response = openai.embeddings.create(
            input=chunk,
            model="text-embedding-ada-002" 
        )
        embedding = response.data[0].embedding
        embeddings.append(embedding)
    return embeddings



def store_in_chromadb(chunks, embeddings, collection_name: str = "solar_vectore_db") :
   
   
    client = chromadb.PersistentClient(path="./chroma_db")
    
    collection = client.get_or_create_collection(name=collection_name)
    
    
    document_ids = [f"chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"source": "pdf_document", "chunk_index": i} for i in range(len(chunks))]
    
  
    collection.add(
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas,
        ids=document_ids
    )
    
    
    
    
if __name__ == "__main__":
    convert_embeddings()
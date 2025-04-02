import chromadb
import openai

from dotenv import load_dotenv
import os


load_dotenv()

openai_key=os.getenv("OPENAI_KEY")

openai.api_key=openai_key
def retrieve_relevant_chunks(query, top_k=3, collection_name="solar_vectore_db"):
   
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_collection(name=collection_name)
    
   
    query_embedding_response = openai.embeddings.create(
        input=query,
        model="text-embedding-ada-002"
    )
    query_embedding = query_embedding_response.data[0].embedding
    
 
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"]
    )
    
    return results

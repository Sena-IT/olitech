from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

def get_llm(api_key,model_name,temperature=0.5):
    llm = ChatGoogleGenerativeAI(api_key=api_key, model=model_name, temperature=temperature)
    return llm


def generative_model(api_key,model_name):
 
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    return model
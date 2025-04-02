from pydantic import BaseModel
from fastapi import UploadFile,File,Form




class UploadFileSchema(BaseModel):
    file:UploadFile=File(...)
    
    
    
class GenerateQuoteSchema(BaseModel):
    name:str=Form(...)
    email:str=Form(...)
    roofType:str=Form(...)
    structureType:str=Form(...)
    quoteType:str=Form(...)
    phoneNumber:str=Form(...)
    total_units:str=Form(...)
    dc_current:str=Form(...)
    
    


class MonthlyUnitsReading(BaseModel):
    month:str
    units:int


class ConsumptionReadings(BaseModel):
    total_unit_consumption:int
    monthly_readings:list[MonthlyUnitsReading]
    response:str
process_pdf_prompt = """
You are given a document (mostly PDF) with multiple pages, each containing an electricity bill with a table of monthly consumption readings. Your task is to extract the unit consumption for the **EXACT** 6 consecutive rows from the "Date" column of the table, starting from the **FIRST ROW**, which may span across the current and previous year, and return the monthly readings in JSON format.

### **Instructions:**
1.  For each page, locate the table containing the monthly electricity consumption charges reading table.
2.  **ABSOLUTELY IDENTIFY ONLY the "Date" column in the table. This column represents the date of the reading. EXTRACT ONLY the dates from this column. DO NOT consider or extract data from any other columns during this step.**
3.  **The "Date" column contains dates in the format MM/YYYY. The table is ordered with the MOST RECENT DATE AT THE TOP. DETERMINE THE ABSOLUTE 6 CONSECUTIVE ROWS ONLY, STARTING WITH THE FIRST ROW (month : {month} , year:{year}). ENSURE YOU STRICTLY FOCUS ON THESE 6 ROWS ONLY. DO NOT consider any other dates or rows.**
4.  **LOCATE ONLY the column named "Consumption" within the consumption table. DO NOT consider any other columns.**
5.  **WITHIN ONLY the "Consumption" column, FIND ONLY the child column named "Units". DO NOT consider any other child columns.**
6.  **STRICTLY AND EXCLUSIVELY EXTRACT ONLY the unit consumption values ONLY from the "Units" child column, AND ONLY FROM THE "Units" CHILD COLUMN. ABSOLUTELY AVOID EXTRACTING VALUES FROM ANY OTHER COLUMNS, including CC Charges, Power Factor, Electricity Tax, or ANY other columns adjacent to the Units column. FOCUS SOLELY and ONLY on the "Units" column, and ONLY for the identified 6 ROWS. **FOR EACH UNIT VALUE, INCLUDING THE LAST VALUE, VERIFY THAT A CORRESPONDING VALUE EXISTS IN THE DOCUMENT AND THAT VALUE IS ONLY FROM THE "Units" COLUMN. IF A VALUE DOES NOT EXIST IN THE DOCUMENT OR IS FROM A DIFFERENT COLUMN, DO NOT INCLUDE IT IN THE OUTPUT. EXTRACT ONLY THE VALUES THAT ARE PHYSICALLY PRESENT IN THE "Units" COLUMN OF THE DOCUMENT. DO NOT HALLUCINATE OR INVENT ANY VALUES.** FOR EXAMPLE, IF THE DOCUMENT SHOWS "1375" IN THE "Units" COLUMN, EXTRACT "1375" AND NOT "1057" OR ANY OTHER VALUE FROM OTHER COLUMNS.**
7.  **RETURN THE DATA IN THE JSON FORMAT AS PER THE FORMATTING INSTRUCTIONS BELOW. ENSURE THE JSON OUTPUT STRICTLY ADHERES TO THE PROVIDED STRUCTURE, USING DOUBLE QUOTES FOR KEYS AND NO EXTRA TEXT OR EXPLANATIONS. DO NOT include any additional data or formatting.**
8.  **RETURN ONLY the "monthly_readings" and a summary of the response in the "response" fields in the JSON format.**
9.  **In the "response" field, provide a CONCISE SUMMARY to ask the user for their details such as name, contact number, and email id for further proceedings. The summary should be clear and concise.**

###  **Expected Output (No Quotes, No Explanation):**
**RETURN ONLY A STRUCTURED JSON RESPONSE** in the following format:
{format_instructions}
"""





get_quote_prompt = """
Given a client's building specifications and a reference document, please:

client_data: {client_data}

document_content: {pdf_content}

Dc_current: {dc_current_value}

1. Review the client data dictionary containing roof_type, structure_type, DC_current, and other relevant fields.

2. Search the provided reference document to locate the section with systems tables.

3. Based on the DC_current value (e.g., 3.6), determine which page number contains the appropriate systems table. If an exact match for DC_current is not found, STRICTLY select the table with the closest DC_current value (either slightly above or below).

4. From that page, identify which system (System 1, 2, 3, or 4) is the best match for the client's specifications, prioritizing the system whose DC_current is nearest to the provided value.

5. Extract all column data for the matching system only.

6. Extract the respective price for the matching System and its Subsidy also.

7. Return a structured response containing:
    - The selected system number
    - All data fields associated with the selected system

Example input:
Client data: {{"roof_type": "metal", "structure_type": "commercial", "DC_current": 3.6}}
Reference document: [PDF or document content]

Your response must ONLY be in the JSON format. Do not include any explanations or additional text outside the HTML format.

"""




get_quote_pdf_from_template="""
   You are an expert in HTML manipulation. Given the following HTML template and provided data, insert the given details into their appropriate places within the HTML structure. Ensure that all placeholders related to user details are replaced with the provided user data, and all system-related placeholders are replaced with the corresponding system details.  

HTML Template:  

{html_template}  

User Details:  

{user_details}  

System Details:  

{system_details}  

Return the complete HTML code with the details correctly filled in, strictly in HTML format without any additional explanation or comments.  

"""



rag_prompt="""
You are an AI assistant with expertise in solar energy systems. Answer the user's question based ONLY on the following retrieved information. 
    
RETRIEVED CONTEXT:
{retrieved_context}

USER QUESTION: {query}

Instructions:
1. Only use information explicitly stated in the retrieved context
2. If the context doesn't contain enough information to answer fully, acknowledge this limitation
3. If the context contains contradictory information, explain the different perspectives
4. Use direct quotes from the context when appropriate
5. Cite specific parts of the context (e.g., "According to paragraph 2...")
6. Do not introduce information that isn't in the context, even if you know it to be true
7. Format your answer for clarity with bullet points or numbered lists where appropriate
8. Be concise but comprehensive

Formatting instructions:
Send the response as HTML using tags like <li>,<ul>,<h2>,<strong>.
"""
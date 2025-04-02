

export const getChatResponse = async (formData: FormData) => {
    try {

        const response = await fetch('http://127.0.0.1:8000/chat', {
            method: "POST",

            body: formData,

        })
        return response
    } catch (error) {
        console.log(error)
    }
}



export const uploadFile = async (formData: FormData) => {
    try {

        const response = await fetch('http://127.0.0.1:8000/uploadPdf', {
            method: "POST",
            body: formData,

        })
        return response
    } catch (error) {
        console.log(error)
    }
}

export const getQuote=async(payload:any)=>{
    try {

        const response = await fetch('http://127.0.0.1:8000/generateQuote', {
            method: "POST",
            body: payload

        })
        return response
    } catch (error) {
        console.log(error)
    }
}
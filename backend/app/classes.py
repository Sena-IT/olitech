from app.model import get_llm, generative_model


class MainModelClass:
    def __init__(self, model, temperature, api_key):
        self.model = model
        self.key = api_key
        self.temperature = temperature

    def set_llm(self):
        return get_llm(
            model_name=self.model, api_key=self.key, temperature=self.temperature
        )

    def set_gen_model(self):
        return generative_model(api_key=self.key, model_name=self.model)






from google import genai

client = genai.Client(api_key="AIzaSyB9UP-Oppfzik6cKEZzkJbg13z_Ck94d_U")

response = client.models.generate_content(
    model="gemini-1.5-pro", contents="Explain how AI works in a few words"
)

print(response.text)
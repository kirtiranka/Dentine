from google import genai
from google.genai import types

from typing import Any

from transcribe_microphone import get_microphone_transcribed_chunk

example_form = [
    {
        "id": "patient_name",
        "type": "text_input",
        "purpose": "Full name of the patient",
        "current_value": "",
    },
    {
        "id": "patient_gender",
        "type": "select",
        "purpose": "Gender identity of the patient",
        "options": ["male", "female", "transgender", "declined"],
        "current_value": "",
    },
    {
        "id": "dob",
        "type": "date",
        "purpose": "Date of birth (YYYY-MM-DD)",
        "current_value": "",
    },
    {
        "id": "contact_number",
        "type": "text_input",
        "purpose": "Primary phone number",
        "current_value": "",
    },
    {
        "id": "chief_complaint",
        "type": "textarea",
        "purpose": "Primary dental issue or reason for visit",
        "current_value": "",
    },
    {
        "id": "known_allergies",
        "type": "multiselect",
        "purpose": "Allergies to medications or dental materials",
        "options": ["penicillin", "latex", "local_anesthetic", "aspirin", "none"],
        "current_value": [],
    },
    {
        "id": "submit_form",
        "type": "button",
        "purpose": "Submits the dental intake form",
        "current_value": None,
    },
]


# 1. Define handler functions corresponding to each form component type
def fill_text(field_id: str, value: str):
    print(f"[TEXT] Field '{field_id}' updated to: '{value}'")


def fill_date(field_id: str, date_value: str):
    print(f"[DATE] Field '{field_id}' set to: '{date_value}'")


def select_option(field_id: str, selected_option: str):
    print(f"[SELECT] Field '{field_id}' selected: '{selected_option}'")


def select_multiple(field_id: str, selected_options: list[str]):
    print(f"[MULTISELECT] Field '{field_id}' selected: {selected_options}")


def click_button(field_id: str, action: str):
    print(f"[BUTTON] Action triggered: '{action}' on element '{field_id}'")


# Map of tool names to local Python callables
TOOL_DISPATCH = {
    "fill_text": fill_text,
    "fill_date": fill_date,
    "select_option": select_option,
    "select_multiple": select_multiple,
    "click_button": click_button,
}


# You are an automated dental EMR assistant. Read the clinical note and call the appropriate
#     tools to fill out the patient intake form. Submit the form when all available data is entered.

#     Form fields available:
#     - patient_name (fill_text)
#     - patient_gender (select_option: 'male', 'female', 'transgender', 'declined')
#     - dob (fill_date: YYYY-MM-DD)
#     - contact_number (fill_text)
#     - chief_complaint (fill_text)
#     - known_allergies (select_multiple: 'penicillin', 'latex', 'local_anesthetic', 'aspirin', 'none')
#     - submit_form (click_button: action='submit')

#     Clinical Note:
#     \"\"\"{clinical_note}\"\"\"


# 2. Main execution method
def fill_dental_form_from_note(form: Any, clinical_note: str):
    client = genai.Client()

    tools = [fill_text, fill_date, select_option, select_multiple, click_button]

    prompt = f"""
    You are an automated dental EMR assistant. Read the clinical note and call the appropriate
    tools to fill out the patient intake form. Submit the form when all available data is entered.

    Context:
    \"\"\"{form}\"\"\"

    Clinical Note:
    \"\"\"{clinical_note}\"\"\"
    """

    response = client.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt,
        config=types.GenerateContentConfig(tools=tools, temperature=0.0),
    )

    # Execute and log every tool the model decided to call
    for call in response.function_calls:
        func = TOOL_DISPATCH.get(call.name)
        if func:
            func(**call.args)


# Example usage:
doctor_dictation = (
    "New patient Marcus Vance, born August 12 1989. Male. Reachable at 555-0199. "
    "Came in complaining of severe throbbing pain on tooth #19, suspect acute pulpitis. "
    "Patient reports a severe allergy to penicillin and latex. Ready to submit."
)

doctor_dictation = get_microphone_transcribed_chunk()
fill_dental_form_from_note(example_form, doctor_dictation)

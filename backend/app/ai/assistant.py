# app/ai/assistant.py
# The dashboard's onboarding assistant — distinct from the customer-facing
# WhatsApp AI (see conversation_service.py). This one talks to the business
# owner, helping them find their way around Exofe itself.

from pydantic import BaseModel
from app.ai.gemini_client import generate_structured

_PAGES = """
- /dashboard — Overview: today's orders, revenue, AI response rate, recent conversations
- /dashboard/conversations — Live WhatsApp chats with customers, take over from the AI or hand back
- /dashboard/orders — All orders and their status, payment method
- /dashboard/products — Product catalog: names, prices, stock, variants (size/color)
- /dashboard/customers — Customer list, order history, notes
- /dashboard/analytics — Sales and revenue charts over time
- /dashboard/ai-assistant — Configure the AI's tone, greeting message, business info, and FAQs it answers
- /dashboard/automation/ai — AI automation rules
- /dashboard/automation/interactive-messages — Button/list WhatsApp message templates
- /dashboard/automation/templates — Meta-approved WhatsApp message templates (for messages outside the 24h window)
- /dashboard/automation/flow-builder — Visual automation flow builder
- /dashboard/team — Invite team members and manage roles
- /dashboard/integrations — Connect the WhatsApp Business number and Shopify
- /dashboard/billing — Subscription plan and payment
- /dashboard/settings — Business profile, hours, delivery, tax, payment methods, language
"""


class AssistantReply(BaseModel):
    reply: str
    suggested_href: str | None = None
    suggested_label: str | None = None


def ask_assistant(message: str, image: tuple[bytes, str] | None = None) -> AssistantReply:
    image_note = (
        "\n\n    The owner also attached a screenshot — look at it, it's almost\n"
        "    certainly what their question is about (an error message, a\n"
        "    confusing screen, etc.)."
        if image is not None
        else ""
    )
    prompt = f"""
    You are Exofe's onboarding assistant, helping a business owner who is
    new to the Exofe dashboard (a WhatsApp AI order-automation platform)
    figure out where to go and what to do next.

    Exofe's dashboard pages:
    {_PAGES}

    The owner just asked or said: "{message}"{image_note}

    Reply in 1-3 short, friendly sentences answering their question or
    pointing them in the right direction. If one specific page above is
    clearly the right next step, set suggested_href to its exact path and
    suggested_label to a short 2-4 word action label for a button (e.g.
    "Connect WhatsApp", "Add products"). Leave both null if no single page
    fits (e.g. a general question).
    """
    return generate_structured(prompt, AssistantReply, image=image)

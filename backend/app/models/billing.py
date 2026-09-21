from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class _CamelModel(BaseModel):
    """Base model that accepts camelCase JSON and exposes snake_case attrs."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class TrialStatusResponse(_CamelModel):
    is_trialing: bool
    days_left: int
    trial_length_days: int
    is_expired: bool
    current_plan: str  # "trial" | "free" | "launch" | "grow" | "scale" | "enterprise"


class SubscribeRequest(_CamelModel):
    # Enterprise has no fixed self-serve price — that's a negotiated deal,
    # activated by an admin via ActivateSubscriptionRequest instead.
    plan: str = Field(..., pattern=r"^(free|launch|grow|scale)$")


class PaymentRow(_CamelModel):
    id: str
    amount: float
    currency: str
    status: str  # "succeeded" | "failed" | "refunded"
    paid_at: str | None


class PaymentsListResponse(BaseModel):
    payments: list[PaymentRow]
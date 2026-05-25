from app.core.database import Base  # noqa: F401

from app.models.user import User, UserRole, AvailabilityStatus  # noqa: F401
from app.models.project import Project, ProjectType, ProjectStatus  # noqa: F401
from app.models.proposal import Proposal, ProposalStatus  # noqa: F401
from app.models.contract import Contract, ContractStatus  # noqa: F401
from app.models.milestone import Milestone, MilestoneStatus  # noqa: F401
from app.models.payment import Payment, PaymentStatus  # noqa: F401
from app.models.review import Review  # noqa: F401
from app.models.portfolio import PortfolioItem  # noqa: F401
from app.models.skill_verification import SkillVerification, BadgeLevel  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.reputation import Reputation  # noqa: F401
from app.models.community import SavedFreelancer  # noqa: F401
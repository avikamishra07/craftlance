from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import auth, users, portfolio, skills, projects, proposals, contracts
from app.api.routes import payments           # M5
from app.api.routes import reviews            # M6
from app.api.routes import ai                 # M7
from app.api.routes import skills_verification  # M8
from app.api.routes import community          # M9


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Professional freelancing, reimagined.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,                 prefix="/api/v1")
app.include_router(users.router,                prefix="/api/v1")
app.include_router(portfolio.router,            prefix="/api/v1")
app.include_router(skills.router,               prefix="/api/v1")
app.include_router(projects.router,             prefix="/api/v1")
app.include_router(proposals.router,            prefix="/api/v1")
app.include_router(contracts.router,            prefix="/api/v1")   # M4
app.include_router(payments.router,             prefix="/api/v1")   # M5
app.include_router(reviews.router,              prefix="/api/v1")   # M6
app.include_router(ai.router,                   prefix="/api/v1")   # M7
app.include_router(skills_verification.router,  prefix="/api/v1")   # M8
app.include_router(community.router,            prefix="/api/v1")   # M9


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/")
def root():
    return {"message": "CraftLance API running"}
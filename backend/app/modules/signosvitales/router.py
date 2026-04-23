from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.deps import get_current_user, require_role
from app.database.session import get_db
from uuid import UUID, uuid4
from datetime import datetime, timezone
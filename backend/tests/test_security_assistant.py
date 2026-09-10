import pytest

from backend.services.security_assistant import SecurityAssistant


class TestSecurityAssistant:
    def test_chat_sql_injection_question(self, db_session):
        assistant = SecurityAssistant(db_session)
        result = assistant.chat("How do I fix SQL Injection?")

        assert result["answer"]  # nosec B101
        assert len(result["recommendations"]) >= 2  # nosec B101
        assert result["session_id"]  # nosec B101
        assert result["analysis_mode"] == "knowledge_base"  # nosec B101

    def test_chat_empty_question(self, db_session):
        assistant = SecurityAssistant(db_session)
        with pytest.raises(ValueError, match="Question cannot be empty"):
            assistant.chat("   ")

    def test_chat_question_too_long(self, db_session):
        assistant = SecurityAssistant(db_session)
        with pytest.raises(ValueError, match="maximum length"):
            assistant.chat("x" * 2001)

    def test_chat_conversation_session(self, db_session):
        assistant = SecurityAssistant(db_session)
        first = assistant.chat("How can I improve security?", session_id="test-session")
        second = assistant.chat("Tell me more", session_id="test-session")

        assert first["session_id"] == "test-session"  # nosec B101
        assert second["session_id"] == "test-session"  # nosec B101

    def test_chat_with_scan_context(self, db_session, sample_scan):
        assistant = SecurityAssistant(db_session)
        result = assistant.chat(
            "What vulnerabilities were found?",
            scan_id=sample_scan.id,
        )
        assert result["answer"]  # nosec B101
        assert "vulnerable.py" in result["answer"] or "finding" in result["answer"].lower()  # nosec B101
        assert result["context_used"] == f"scan:{sample_scan.id}"  # nosec B101

    def test_chat_invalid_scan(self, db_session):
        assistant = SecurityAssistant(db_session)
        with pytest.raises(ValueError, match="Scan 999 not found"):
            assistant.chat("Explain this", scan_id=999)

    def test_chat_general_question(self, db_session):
        assistant = SecurityAssistant(db_session)
        result = assistant.chat("What is DevSecOps?")
        assert result["answer"]  # nosec B101
        assert result["context_used"] == "general"  # nosec B101

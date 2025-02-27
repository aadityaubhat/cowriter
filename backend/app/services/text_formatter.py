from app.models.text import ActionRequest, EvalRequest


def format_action_prompt(request: ActionRequest) -> str:
    """Format the prompt with user context and preferences."""

    # Add specific formatting guidelines based on document type
    document_type_guidelines = {
        "X": "- Keep it under 280 characters\n- Use hashtags sparingly\n- Make it engaging and shareable",
        "LinkedIn": "- Use professional language\n- Include industry-relevant insights\n- Format for readability with short paragraphs",
        "Blog": "- Use engaging headings and subheadings\n- Include an introduction and conclusion\n- Break up text with bullet points where appropriate",
        "Essay": "- Maintain a clear thesis and structure\n- Use formal academic language\n- Include proper citations if referencing external content",
        "Threads": "- Break content into numbered points\n- Keep each point concise\n- Use a conversational tone",
        "Reddit": "- Use a conversational, authentic tone\n- Format with paragraphs and bullet points for readability\n- Consider the subreddit culture in your writing style",
        "Custom": "- Focus on clarity and readability\n- Use appropriate formatting for the content type",
    }

    # Get the document type, defaulting to "Custom" if None
    document_type = request.document_type or "Custom"

    # Get the guidelines for the selected document type
    type_guidelines = document_type_guidelines.get(
        document_type, document_type_guidelines["Custom"]
    )

    return f"""You are a professional writing assistant. Your task is to modify the text according to the user's requirements.

CONTEXT (FOR YOUR UNDERSTANDING ONLY - DO NOT INCLUDE IN RESPONSE):
- User Background: {request.about_me}
- Style Preference: {request.preferred_style}
- Tone Preference: {request.tone}
- Document Type: {document_type}
- Task: {request.action_description}

SPECIFIC GUIDELINES FOR {document_type.upper()} FORMAT:
{type_guidelines}

ORIGINAL TEXT:
{request.text}

INSTRUCTIONS:
1. Modify the text according to the task description
2. Adapt it specifically for {document_type} format
3. Use the user's preferred style ({request.preferred_style}) and tone ({request.tone})
4. Format appropriately using Markdown

YOUR RESPONSE MUST:
- ONLY contain the modified text
- NOT include any explanations or comments
- NOT include phrases like "Here's the modified text" or similar
- NOT include any of the context information provided above
- NOT include the original prompt or instructions
- START IMMEDIATELY with the modified content

IMPORTANT: I will use your response exactly as provided, so do not include ANY text other than the modified content.
"""  # noqa: E501


def format_eval_prompt(request: EvalRequest) -> str:
    """Format the prompt for evaluation."""
    return f"""As a writing assistant, please evaluate the following text based on the specified criteria.  # noqa: E501

Evaluation Criteria: {request.eval_description}

Text to Evaluate:
{request.text}

Please provide a detailed evaluation of the text based on the specified criteria. Your evaluation should:
1. Start with a brief summary of your assessment
2. Include specific examples from the text to support your evaluation
3. Provide a numerical rating on a scale of 0-10 (where 0 is the worst and 10 is the best)
4. Offer constructive suggestions for improvement

IMPORTANT: You MUST include a clear numerical score between 0 and 10 in your evaluation.
Format it as "Rating: X/10" where X is the score.

Format your response using Markdown:
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use > for important callouts

Return ONLY the evaluation with Markdown formatting. Do not include any other text, comments, or explanations."""  # noqa: E501

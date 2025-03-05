from app.models.text import ActionRequest, EvalRequest


def _get_document_type_guidance(document_type: str) -> str:
    """Get the guidance text for a specific document type."""
    if document_type == "X":
        return """
Document Type: X (Twitter)
STRICT REQUIREMENT: The response MUST be 280 characters or less.
X (Twitter) posts are extremely short. Use concise language, abbreviations when appropriate.
Include 1-2 relevant hashtags only if space permits. DO NOT exceed 280 characters under any circumstances.
If the original content is too long, focus on the most impactful point only.
Character limits are ABSOLUTE - your ENTIRE response must be under 280 characters including spaces and punctuation."""
    elif document_type == "LinkedIn":
        return """
Document Type: LinkedIn
LinkedIn is a professional network. Content should be business-appropriate and professional.
Typical LinkedIn posts are 1-3 paragraphs. For longer content, use clear formatting and headlines.
Focus on professional insights, career development, industry trends, or thought leadership.
Avoid overly promotional language. Include a call-to-action when appropriate."""
    elif document_type == "Threads":
        return """
Document Type: Threads
STRICT REQUIREMENT: The response MUST be 500 characters or less.
Threads posts are concise and conversational. Can be part of a sequence of related posts.
Visual, engaging, and personal tone works well. Keep paragraphs very short.
Focus on clarity and engagement rather than formal structure.
Character limits are ABSOLUTE - your ENTIRE response must be under 500 characters including spaces and punctuation."""
    elif document_type == "Reddit":
        return """
Document Type: Reddit
Reddit allows longer form content. Format for readability with paragraphs, headers, and bullet points.
Consider the informational, discussion-oriented nature of Reddit. Include relevant information and context.
Use a conversational but clear tone. Structure with clear points for engagement and discussion.
Avoid marketing language, as Reddit users respond poorly to obvious promotion."""
    elif document_type == "Blog":
        return """
Document Type: Blog
Blogs are structured content with clear sections, headers, and an engaging flow.
Include an attention-grabbing introduction, well-organized body content, and a conclusion.
Use varied sentence structure, engaging storytelling, and visual elements like lists and quotes.
Aim for depth and value to the reader, with appropriate SEO considerations."""
    elif document_type == "Essay":
        return """
Document Type: Essay
Essays are formal, structured pieces with clear thesis, supporting arguments, and conclusion.
Maintain logical flow and coherent structure throughout. Use transitions between paragraphs.
Support claims with evidence or reasoning. Maintain a formal academic tone if appropriate.
End with a strong conclusion that reinforces the main points or thesis."""
    elif document_type == "Email":
        return """
Document Type: Email
Emails should be clear, concise, and purposeful with an appropriate greeting and sign-off.
Include a descriptive subject line and organize content with paragraphs and bullet points when needed.
Maintain a professional tone unless a more casual approach is specifically requested.
Be direct about any requested actions or responses needed from the recipient."""
    elif document_type == "Newsletter":
        return """
Document Type: Newsletter
Newsletters should be engaging, scannable, and provide value to subscribers.
Include a compelling subject line, clear sections with headers, and visually appealing formatting.
Balance informative content with engaging storytelling and calls to action.
Consider the regular cadence of the newsletter and maintain consistent voice and structure."""
    elif document_type != "Custom":
        return f"""
Document Type: {document_type}
This content is intended for {document_type}. Please ensure your modifications are appropriate for this platform/format,
following its typical style, length constraints, and engagement patterns."""
    return ""


def _get_character_count_warning(document_type: str) -> str:
    """Get character count warning based on document type."""
    if document_type == "X":
        return """
CRITICAL: THE LENGTH LIMIT IS 280 CHARACTERS FOR X (TWITTER) POSTS. COUNT YOUR CHARACTERS CAREFULLY.
Your final output MUST be 280 characters or fewer.
If your draft exceeds this limit, aggressively condense until it fits the 280 character limit.
This is not a suggestion but a hard requirement."""
    elif document_type == "Threads":
        return """
CRITICAL: THE LENGTH LIMIT IS 500 CHARACTERS FOR THREADS POSTS. COUNT YOUR CHARACTERS CAREFULLY.
Your final output MUST be 500 characters or fewer.
If your draft exceeds this limit, aggressively condense until it fits the 500 character limit.
This is not a suggestion but a hard requirement."""
    elif document_type == "Email":
        return """
For emails, aim for brevity and clarity. While there's no strict character limit,
most effective emails are between 50-125 words. Longer emails risk being skimmed or ignored.
Keep paragraphs short (2-3 sentences) and use bullet points for multiple items."""
    return ""


def format_action_prompt(request: ActionRequest) -> str:
    """Format the prompt with user context and preferences."""
    document_type_guidance = ""

    if request.document_type:
        document_type_guidance = _get_document_type_guidance(request.document_type)

    # Create a modified formatting guide based on document type
    formatting_guide = """Format your response using Markdown:  # noqa: E501
- Use # for main headings
- Use ## for subheadings
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use numbered lists for sequential items
- Use > for quotes or important callouts"""

    # For X/Twitter and Threads, simplify the formatting guide to discourage complex formatting
    if request.document_type in ["X", "Threads"]:
        formatting_guide = """Keep formatting minimal and appropriate for short-form content."""

    # Add specific character count validation instructions
    character_count_warning = ""
    if request.document_type:
        character_count_warning = _get_character_count_warning(request.document_type)

    return f"""As a writing assistant, please help modify the following text according to the specified requirements.  # noqa: E501

User Background:
{request.about_me}

Writing Preferences:
- Style: {request.preferred_style}
- Tone: {request.tone}
{document_type_guidance}

Task: {request.action_description}

Original Text:
{request.text}

{formatting_guide}
{character_count_warning}







Return ONLY the modified text with appropriate formatting. Do not include any other text, comments, or explanations."""  # noqa: E501


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

from app.models.text import ActionRequest, EvalRequest


def format_action_prompt(request: ActionRequest) -> str:
    """Format the prompt with user context and preferences."""
    return f"""As a writing assistant, please help modify the following text.  # noqa: E501

User Background:
{request.about_me}

Writing Preferences:
- Style: {request.preferred_style}
- Tone: {request.tone}

Task: {request.action_description}

Original Text:
{request.text}

Please modify the text according to the task, style, and tone preferences. Format your response using Markdown:  # noqa: E501
- Use # for main headings
- Use ## for subheadings
- Use **bold** for emphasis
- Use *italic* for subtle emphasis
- Use bullet points where appropriate
- Use numbered lists for sequential items
- Use > for quotes or important callouts

Return ONLY the modified text with Markdown formatting. Do not include any other text, comments, or explanations."""  # noqa: E501


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

from langgraph.graph import END, StateGraph

from app.graph.nodes import (
    fetch_context_node,
    finalize_node,
    generate_suggestions_node,
    identify_language_node,
    route_after_generate,
)
from app.graph.state import SuggestionState


def build_graph():
    builder = StateGraph(SuggestionState)

    builder.add_node("identify_language", identify_language_node)
    builder.add_node("fetch_context", fetch_context_node)
    builder.add_node("generate_suggestions", generate_suggestions_node)
    builder.add_node("finalize", finalize_node)

    builder.set_entry_point("identify_language")
    builder.add_edge("identify_language", "fetch_context")
    builder.add_edge("fetch_context", "generate_suggestions")
    builder.add_conditional_edges(
        "generate_suggestions",
        route_after_generate,
        {"retry": "generate_suggestions", "finalize": "finalize"},
    )
    builder.add_edge("finalize", END)

    return builder.compile()


suggestion_graph = build_graph()

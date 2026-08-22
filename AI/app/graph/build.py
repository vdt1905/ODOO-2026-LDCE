from langgraph.graph import END, StateGraph

from app.graph.nodes import (
    classify_intent_node,
    converse_node,
    fetch_context_node,
    finalize_node,
    generate_suggestions_node,
    identify_language_node,
    route_after_generate,
    route_on_intent,
)
from app.graph.state import SuggestionState


def build_graph():
    """
    identify_language
            |
       classify_intent
         /          \\
     chat            plan
       |               |
    converse      fetch_context
       |               |
       |      generate_suggestions <--+ (retry on unparseable JSON)
       |               |
       +-----> finalize <-------------+
                       |
                      END

    The router is the whole point of the redesign. Every message used to go
    straight down the planning branch, so a greeting or a question about the
    assistant itself came back as a list of cities with prices on it.
    """
    builder = StateGraph(SuggestionState)

    builder.add_node("identify_language", identify_language_node)
    builder.add_node("classify_intent", classify_intent_node)
    builder.add_node("converse", converse_node)
    builder.add_node("fetch_context", fetch_context_node)
    builder.add_node("generate_suggestions", generate_suggestions_node)
    builder.add_node("finalize", finalize_node)

    builder.set_entry_point("identify_language")
    builder.add_edge("identify_language", "classify_intent")

    builder.add_conditional_edges(
        "classify_intent",
        route_on_intent,
        {"chat": "converse", "plan": "fetch_context"},
    )

    builder.add_edge("converse", "finalize")
    builder.add_edge("fetch_context", "generate_suggestions")
    builder.add_conditional_edges(
        "generate_suggestions",
        route_after_generate,
        {"retry": "generate_suggestions", "finalize": "finalize"},
    )
    builder.add_edge("finalize", END)

    return builder.compile()


suggestion_graph = build_graph()

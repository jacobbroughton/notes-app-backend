import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection } from "lexical";
import { parseEditorState } from "lexical/LexicalUpdates";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { emptyEditorState } from "../utils/editorUtils";
import { RootState } from "../redux/store";

function PageChangePlugin() {
  const pages = useSelector((state: RootState) => state.pages);
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let parsedEditorState = editor.parseEditorState(emptyEditorState);

    if (pages.untitledPage?.IS_UNTITLED && !pages.active) {
      parsedEditorState = editor.parseEditorState(pages.untitledPage?.BODY);
    } else if (pages.active) {
      if (pages.active.DRAFT_BODY !== pages.active.BODY) {
        parsedEditorState = editor.parseEditorState(pages.active?.DRAFT_BODY);
      } else {
        parsedEditorState = editor.parseEditorState(pages.active?.BODY);
      }
    }
    editor.setEditorState(parsedEditorState);
  }, [pages.active?.BODY, pages.untitledPage?.IS_INITIAL]);

  return <></>;
}

export default PageChangePlugin;

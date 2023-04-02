import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  // $createParagraphNode,
  // $createTextNode,
  // $getRoot,
  // $getSelection,
  FOCUS_COMMAND,
} from "lexical";
// import { parseEditorState } from "lexical/LexicalUpdates";
import { useEffect } from "react";
import { useSelector } from "react-redux";
// import { emptyEditorState } from "../utils/editorUtils";
import { RootState } from "../redux/store";
import { useEditorFocus } from "../utils/useEditorFocus";

export function FocusPlugin() {
  const pages = useSelector((state: RootState) => state.pages);
  const [editor] = useLexicalComposerContext();
  const [hasFocus, setFocus] = useEditorFocus();

  return <></>;
}

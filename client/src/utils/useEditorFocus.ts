import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BLUR_COMMAND, COMMAND_PRIORITY_LOW, FOCUS_COMMAND } from "lexical";
import { useEffect, useLayoutEffect, useState } from "react";
import { mergeRegister } from "@lexical/utils";

export const useEditorFocus = () => {
  const [editor] = useLexicalComposerContext();

  const [hasFocus, setHasFocus] = useState(() => {
    return editor.getRootElement() === document.activeElement;
  });

  useLayoutEffect(() => {
    setHasFocus(editor.getRootElement() === document.activeElement);
    // return mergeRegister(
    //   editor.registerCommand(
    //     FOCUS_COMMAND,
    //     () => {
    //       console.log("Focus");
    //       return true;
    //     },
    //     1
    //   ),
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          console.log("focus");
          return true;
        },
        1
      )
    // );
  }, [editor]);

  // useEffect(() => {
  //   console.log("Has focus:", hasFocus)
  // }, [hasFocus])

  return [hasFocus, setHasFocus]
};

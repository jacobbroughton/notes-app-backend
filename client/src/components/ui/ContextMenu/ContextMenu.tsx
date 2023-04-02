import { RefObject, forwardRef } from "react";
import {
  ContextMenuButton,
  SidebarItemState,
  PageState,
  FolderState,
} from "../../../types";
import "./ContextMenu.css";

const ContextMenu = ({
  item,
  positionX,
  positionY,
  toggled,
  buttons,
  contextMenuRef,
}: {
  item: FolderState | PageState | null;
  positionX: number;
  positionY: number;
  toggled: boolean;
  buttons: Array<ContextMenuButton>;
  contextMenuRef: RefObject<HTMLMenuElement>;
}) => {
  return (
    <menu
      style={{
        top: positionY + 2 + "px",
        left: positionX + 2 + "px",
      }}
      className={`context-menu ${toggled ? "active" : ""}`}
      ref={contextMenuRef}
    >
      {buttons
        .filter((button: ContextMenuButton) => button.active)
        .map((button: ContextMenuButton, index: number) => {
          const formattedClassName = button.text.split(" ").join("-").toLowerCase();

          if (button.isSpacer) return <hr key={index}></hr>;

          return (
            <button
              onClick={(e) => button.onClick(e, item)}
              key={index}
              className={`context-menu-button ${formattedClassName}`}
            >
              <span>{button.text}</span> <span className="icon">{button.icon}</span>
            </button>
          );
        })}
    </menu>
  );
};
export default ContextMenu;

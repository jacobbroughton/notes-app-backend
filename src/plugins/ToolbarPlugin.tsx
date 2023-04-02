import { HeadingToolbarPlugin } from "./HeadingToolbarPlugin";
import { ListToolbarPlugin } from "./ListToolbarPlugin";
import { TextFormatToolbarPlugin } from "./TextFormatToolbarPlugin";

export default function ToolbarPlugin(): JSX.Element {
  return (
    <div className="toolbar">
      <ListToolbarPlugin />
      <HeadingToolbarPlugin />
      <TextFormatToolbarPlugin />
    </div>
  );
}

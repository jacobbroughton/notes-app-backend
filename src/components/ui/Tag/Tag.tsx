import { ColorState } from "../../../types";
import "./Tag.css";

const Tag = ({ name, color }: { name: string; color: ColorState | null }) => {


  return (
    <div className="tag">
      <span
        className="color-span"
        style={{ backgroundColor: color ? color.COLOR_CODE : '#000000' }}
        title={`Color: ${color ? color.COLOR_CODE : 'There was an error, no color found'}`}
      >
        &nbsp;
      </span>
      <p title={name}>{name}</p>
    </div>
  );
};
export default Tag;

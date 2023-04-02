import {MouseEvent} from "react"
import { useSelector, useDispatch } from "react-redux";
import XIcon from "../Icons/XIcon";
import {
  deselectPage,
  selectPage,
  setPageClosed,
  setPageStagedForSwitch,
} from "../../../redux/pages";
import "./OpenPageButton.css";
import { toggleModal } from "../../../redux/modals";
import { RootState } from "../../../redux/store";
import { PageState } from "../../../types";
import { emptyEditorState } from "../../../utils/editorUtils";

const OpenPageButton = ({ page }: { page: PageState | null }) => {
  const pages = useSelector((state: RootState) => state.pages);
  const dispatch = useDispatch();

  if (!page)
    return (
      <button className={`page-button untitled active`}>
        <p>Untitled</p>
        {(pages.untitledPage.NAME !== "" || pages.untitledPage.BODY !== emptyEditorState) && (
          <span className="unsaved-circle">&nbsp;</span>
        )}
      </button>
    );

  const unsaved = page.DRAFT_NAME !== page.NAME || page.DRAFT_BODY !== page.BODY;

  function handleXButtonClick(e: MouseEvent, unsaved: boolean) {
    e.stopPropagation()
    if (unsaved) {
      if (!pages.stagedToSwitch) dispatch(setPageStagedForSwitch(page));
      dispatch(toggleModal("unsavedWarning"));
    } else {
      dispatch(setPageClosed(page));
    }
  }

  return (
    <div
      className={`page-button ${
        pages.active?.PAGE_ID === page?.PAGE_ID ? "active" : ""
      } ${unsaved ? "unsaved" : ""}`}
      onClick={() => dispatch(selectPage(page))}
    >
      <p>{page.NAME}</p>
      <button className="x-button" onClick={(e) => handleXButtonClick(e, unsaved)}>
        <XIcon />
        {unsaved && <span className="unsaved-circle">&nbsp;</span>}
      </button>
    </div>
  );
};

export default OpenPageButton;

import { useDispatch, useSelector } from "react-redux";
import "./ColorPicker.css";
import { setColorPickerMenu } from "../../../redux/colorPickerMenu";
import CheckIcon from "../Icons/CheckIcon";
import XIcon from "../Icons/XIcon";
import React, { useEffect, useRef, useState } from "react";
import { addCustomColorOption } from "../../../redux/tags";
import { throwResponseStatusError } from "../../../utils/throwResponseStatusError";
import { ColorState } from "../../../types";
import { RootState } from "../../../redux/store";
import { getApiUrl } from "../../../utils/getUrl";

const ColorPicker = ({
  onColorSelect,
  selectedColor,
  showColorCode,
}: {
  onColorSelect: Function;
  selectedColor: ColorState | null;
  showColorCode: boolean;
}) => {
  const dispatch = useDispatch();
  const colorPickerMenu = useSelector((state: RootState) => state.colorPickerMenu);
  const { colorOptions } = useSelector((state: RootState) => state.tags);
  const [colorConfirmationShowing, setColorConfirmationShowing] = useState(false);
  const [newCustomColor, setNewCustomColor] = useState<string | null>(null);
  const [deleteModeToggled, setDeleteModeToggled] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<ColorState | null>(null);
  const menuRef = useRef<HTMLMenuElement>(null);

  function handleToggleClick() {
    console.log('8')

    dispatch(setColorPickerMenu({ toggled: !colorPickerMenu.toggled }));
  }

  function handleNewColorChange(e: React.ChangeEvent) {
    console.log('7')

    setNewCustomColor((e.target as HTMLInputElement).value);
    setColorConfirmationShowing(true);
  }

  async function addNewCustomColor() {
    console.log('6')

    try {
      const payload = {
        colorCode: newCustomColor,
      };

      const response = await fetch(`${getApiUrl()}/tags/color-options/new/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      dispatch(addCustomColorOption(data.justCreatedColor));
      setNewCustomColor(null);
      setColorConfirmationShowing(false);
    } catch (error) {
      console.log(error);
    }
  }

  async function deleteCustomColor(color: ColorState) {
    console.log('5')

    try {
      const payload = {
        colorId: color.ID,
      };

      const response = await fetch(`${getApiUrl()}/tags/color-options/delete/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json;charset=UTF-8",
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) throwResponseStatusError(response, "POST");

      const data = await response.json();

      if (!data) throw "There was a problem parsing tags/color-options/delete response";

      setColorToDelete(null);
      setDeleteModeToggled(false);
    } catch (error) {
      console.log(error);
    }
  }

  function handleDeleteClick() {
    console.log('delete button')
    setDeleteModeToggled(!deleteModeToggled);
  }

  function handleColorClick(color: ColorState) {
    console.log('2')

    if (deleteModeToggled) {
      setColorToDelete(color);
    } else {
      onColorSelect(color);
    }
  }

  function handleConfirmClick(): void {
    console.log('3')

    if (colorConfirmationShowing) {
      addNewCustomColor();
    }

    if (colorToDelete) {
      deleteCustomColor(colorToDelete);
    }
  }

  function handleCancelClick() {
    console.log('4')

    // e.stopPropagation();
    if (colorConfirmationShowing) {
      setNewCustomColor(null);
      setColorConfirmationShowing(false);
    }

    if (colorToDelete) {
      setColorToDelete(null);
      setDeleteModeToggled(false);
    }
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        colorPickerMenu.toggled && 
        !menuRef.current?.contains(e.target as HTMLElement) &&
        !(e.target as HTMLElement).classList.contains("color-picker-toggle")
      ) {
        setNewCustomColor(null);
        setColorConfirmationShowing(false);
        dispatch(setColorPickerMenu({ toggled: false }));
        if (deleteModeToggled) setDeleteModeToggled(false);
        if (colorToDelete) setColorToDelete(null);
      }

      if (
        deleteModeToggled &&
        !(e.target as HTMLElement).classList.contains("color-button") &&
        !(e.target as HTMLElement).classList.contains("delete")
      ) {
        setColorToDelete(null);
        setDeleteModeToggled(false);
      }
    }

    window.addEventListener("click", handler);

    return () => {
      window.removeEventListener("click", handler);
    };
  });

  return (
    <div className="color-picker-parent">
      <div className="ignore-overflow">
        <button
          onClick={handleToggleClick}
          className={`color-picker-toggle ${!selectedColor ? "no-color" : ""}`}
          title="Open Color Picker"
          style={{ ...(selectedColor && { backgroundColor: selectedColor.COLOR_CODE }) }}
        >
          &nbsp;
        </button>
        {showColorCode && (
          <p className="color-text">
            {selectedColor ? selectedColor.COLOR_CODE : "No Color Selected"}
          </p>
        )}
        {colorPickerMenu.toggled && (
          <menu ref={menuRef}>
            <div className="color-options-container">
              <p>Default Colors</p>
              <div className="buttons">
                {colorOptions.default?.map((color, index) => {
                  return (
                    <button
                      className="color-button"
                      title={color.COLOR_CODE}
                      style={{ backgroundColor: color.COLOR_CODE }}
                      key={index}
                      onClick={() => handleColorClick(color)}
                      disabled={deleteModeToggled}
                    >
                      &nbsp;
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="color-options-container">
              <p>Your Custom Colors</p>
              <div className="buttons">
                {colorOptions.userCreated.length === 0 && <p>(None found)</p>}
                {colorOptions.userCreated?.map((color, index) => {
                  return (
                    <button
                      className="color-button"
                      title={color.COLOR_CODE}
                      style={{ backgroundColor: color.COLOR_CODE }}
                      key={index}
                      onClick={() => handleColorClick(color)}
                    >
                      &nbsp;
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="custom-color-button-container">
              <p>Add or Remove Colors</p>
              <div className="custom-color-options">
                <input
                  type="color"
                  onChange={handleNewColorChange}
                  onClick={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
                <div
                  className={`color-option add ${deleteModeToggled ? "disabled" : ""}`}
                  onClick={(e) => e.preventDefault()}
                >
                  +
                </div>
                <div
                  className={`color-option delete ${
                    colorConfirmationShowing ? "disabled" : ""
                  }`}
                  onClick={handleDeleteClick}
                >
                  -
                </div>
                {deleteModeToggled && !colorToDelete && (
                  <span className="delete-instructions">(Choose a color)</span>
                )}
                {deleteModeToggled && colorToDelete && (
                  <div
                    className="new-color-example"
                    title={colorToDelete.COLOR_CODE}
                    style={{ backgroundColor: colorToDelete.COLOR_CODE }}
                  >
                    &nbsp;
                  </div>
                )}

                {colorConfirmationShowing && (
                  <div
                    className="new-color-example"
                    title={newCustomColor || ""}
                    style={{ backgroundColor: newCustomColor || "" }}
                  >
                    &nbsp;
                  </div>
                )}

                {(colorConfirmationShowing || colorToDelete) && (
                  <>
                    <button className="confirm-btn" onClick={handleConfirmClick}>
                      <CheckIcon />
                    </button>
                    <button className="cancel-btn" onClick={handleCancelClick}>
                      <XIcon />
                    </button>
                  </>
                )}
              </div>
            </div>
          </menu>
        )}
      </div>
    </div>
  );
};
export default ColorPicker;

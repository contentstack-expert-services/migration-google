const getDropdownValuePromo = (type) => {
  const alignment = [
    {
      type: "Left",
      value: "Left  : left",
    },
    {
      type: "Right",
      value: "Right : right"
    },
    {
      type: "Center",
      value: "Center : center"
    },
    {
      type: "Raised",
      value: "Raised : raised"
    },
    {
      type: "Raised Secondary",
      value: "Raised Secondary : raised-secondary"
    },
    {
      type: "Flat",
      value: "Flat : flat"
    }
  ]
  const isPresent = alignment?.find((item) => item?.type === type);
  if (isPresent?.value) {
    return isPresent?.value;
  } else {
    console.log("dropDown Not found", type)
    return ""
  }
}

module.exports = getDropdownValuePromo;
export function removeDuplicatedItems(array, key = 'uuid') {
  const itemsChecked = new Set();
  return array.filter((item) => {
    if (itemsChecked.has(item[key])) {
      return false;
    }
    itemsChecked.add(item[key]);
    return true;
  });
}

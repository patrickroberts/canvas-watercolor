export const select = {
  min: Function.prototype.apply.bind(Math.min, Math),
  max: Function.prototype.apply.bind(Math.max, Math),
  average (distances) {
    let sum = 0

    for (let index = distances.length - 1; index >= 0; index--) {
      sum += distances[index]
    }

    return sum / distances.length
  },
  median (distances) {
    distances.sort((a, b) => a - b)

    const middle = distances.length >> 1

    if (distances.length % 2 === 1) {
      return distances[middle]
    } else {
      return (distances[middle] + distances[middle - 1]) / 2
    }
  }
}

export const weights = {
  default: [1, 1, 1],
  natural: [2126, 7152, 722]
}

export function compare (priority, a, b) {
  return (b.count >= priority) - (a.count >= priority) || a.distance - b.distance
}

export function insertionSort (array, compare) {
  const length = array.length

  for (let i = 1; i < length; i++) {
    const value = array[i]
    let j = i - 1

    while (j >= 0 && compare(value, array[j]) < 0) {
      array[j + 1] = array[j]
      j--
    }

    array[j + 1] = value
  }
}

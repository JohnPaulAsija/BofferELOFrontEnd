export const getMatchesFromAPI = async () => {
  try {
    const apiUrl = `http://127.0.0.1:8000/data/Matches`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error fetching matches:', error);
  }
}

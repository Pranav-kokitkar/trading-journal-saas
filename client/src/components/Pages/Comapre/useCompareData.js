import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export const useCompareData = (authorizationToken) => {
  const [accounts, setAccounts] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoadingData(true);
      try {
        await Promise.all([fetchAccounts(), fetchStrategies(), fetchTags()]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoadingData(false);
      }
    };

    if (authorizationToken) {
      fetchAllData();
    }
  }, [authorizationToken]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/account/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: authorizationToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      } else {
        console.error("Failed to fetch accounts");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/strategy?all=true`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStrategies(data);
      } else {
        console.error("Failed to fetch strategies");
      }
    } catch (error) {
      console.error("Error fetching strategies:", error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(
        `${(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000"))}/api/tags?all=true`,
        {
          method: "GET",
          headers: {
            Authorization: authorizationToken,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTags(data);
      } else {
        console.error("Failed to fetch tags");
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  return {
    accounts,
    strategies,
    tags,
    loadingData,
  };
};

import { getUpcomingItems } from "../../utils/dateHelpers";

describe("Patient Portal Logic - Critical Paths", () => {
  const now = Date.now();
  const oneHourFromNow = new Date(now + 60 * 60 * 1000).toISOString();
  const eightDaysFromNow = new Date(now + 8 * 24 * 60 * 60 * 1000).toISOString();
  const mockAppointments = [
    { id: 1, date: oneHourFromNow }, // Within 7 days (should pass)
    { id: 2, date: eightDaysFromNow }, // 8 days out (should fail)
  ];

  test("should only return appointments within the next 7 days", () => {
    const result = getUpcomingItems(mockAppointments, "date");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  test("should handle empty or malformed data gracefully", () => {
    const result = getUpcomingItems([], "date");
    expect(result).toEqual([]);
  });

  test("should exclude items with missing date field", () => {
    const withMissing = [
      { id: 1, date: new Date().toISOString() },
      { id: 2 },
    ] as { id: number; date?: string }[];
    const result = getUpcomingItems(withMissing, "date");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  test("should exclude items with invalid date strings", () => {
    const withInvalid = [
      { id: 1, date: new Date().toISOString() },
      { id: 2, date: "not-a-date" },
    ];
    const result = getUpcomingItems(withInvalid, "date");
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});

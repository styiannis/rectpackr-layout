beforeEach(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(performance.now()); // Pass current time to callback
    return 1; // Return mock ID
  });
});

afterEach(() => {
  (window.requestAnimationFrame as jest.Mock).mockRestore();
});

import getUserDetails from '../../src/shared/userDetails';
import pool from '../../src/config/db';

jest.mock('../../src/config/db');
const mockQuery = pool.query as jest.Mock;

describe('getUserDetails', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Should return reporting manager and position if the user is found', async () => {
    const mockResult = {
      rows: [
        { Reporting_Manager: '100', Position: 'Junior Engineers' },
      ],
    };
    mockQuery.mockResolvedValue(mockResult);

    const staffId = 123;
    const result = await getUserDetails(staffId);

    expect(mockQuery).toHaveBeenCalledWith(
    `SELECT "Reporting_Manager", "Position" FROM public."Employees" WHERE "Staff_ID" = $1`,
      [staffId]
    );
    expect(result).toEqual({ reportingManager: '100', position: 'Junior Engineers' });
  });

  it('Should throw an error if the user is not found', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const staffId = 123;

    await expect(getUserDetails(staffId)).rejects.toThrow(
      `Staff member with ID ${staffId} not found`
    );
  });

  it('Should handle database errors', async () => {
    mockQuery.mockRejectedValue(new Error('Database query failed'));

    const staffId = 123;

    await expect(getUserDetails(staffId)).rejects.toThrow(
      'Database query failed'
    );
  });
});

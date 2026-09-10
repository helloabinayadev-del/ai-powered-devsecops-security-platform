interface RiskFile {
  filename: string;
  risk_level: string;
  issues: number;
}

interface TopRiskFilesProps {
  files: RiskFile[];
}

export default function TopRiskFiles({
  files,
}: TopRiskFilesProps) {

  return (

    <div className="chart-card">

      <h2>Top Risk Files</h2>

      {files.length === 0 ? (

        <p>No risky files found.</p>

      ) : (

        <table className="risk-table">

          <thead>

            <tr>

              <th>Filename</th>

              <th>Risk</th>

              <th>Issues</th>

            </tr>

          </thead>

          <tbody>

            {files.map((file,index)=>(

              <tr key={index}>

                <td>{file.filename}</td>

                <td>

                  <span className="badge-risk">

                    {file.risk_level}

                  </span>

                </td>

                <td>{file.issues}</td>

              </tr>

            ))}

          </tbody>

        </table>

      )}

    </div>

  );

}
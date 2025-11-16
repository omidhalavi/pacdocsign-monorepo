-- Update w_docs_received to 'Y' for orders that have documents but w_docs_received is not 'Y'
-- This script fixes the data inconsistency where documents exist but w_docs_received is not set

UPDATE borrower b
SET b.w_docs_received = 'Y'
WHERE EXISTS (
    SELECT 1 
    FROM document_count dc 
    WHERE dc.borrower_id = b.Id 
    AND dc.status = 'A' 
    AND dc.usertype != 'signer'
    AND dc.filename NOT LIKE '%merged.%'
    AND dc.filename NOT LIKE '%moved.%'
)
AND (b.w_docs_received IS NULL OR b.w_docs_received = '' OR b.w_docs_received != 'Y');

-- Show what will be updated (run this first to verify)
-- SELECT 
--     b.Id,
--     b.w_Loan_Number,
--     b.w_Borrower_First_Name,
--     b.w_Borrower_Last_Name,
--     b.w_docs_received as current_value,
--     'Y' as new_value,
--     (SELECT COUNT(*) FROM document_count dc 
--      WHERE dc.borrower_id = b.Id 
--      AND dc.status = 'A' 
--      AND dc.usertype != 'signer'
--      AND dc.filename NOT LIKE '%merged.%'
--      AND dc.filename NOT LIKE '%moved.%') as document_count
-- FROM borrower b
-- WHERE EXISTS (
--     SELECT 1 
--     FROM document_count dc 
--     WHERE dc.borrower_id = b.Id 
--     AND dc.status = 'A' 
--     AND dc.usertype != 'signer'
--     AND dc.filename NOT LIKE '%merged.%'
--     AND dc.filename NOT LIKE '%moved.%'
-- )
-- AND (b.w_docs_received IS NULL OR b.w_docs_received = '' OR b.w_docs_received != 'Y');

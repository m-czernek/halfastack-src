import { Link } from 'gatsby';
import * as React from 'react';
import { css } from '@emotion/core';

export interface PaginationProps {
  currentPage: number;
  numPages: number;
}

const navCss = css`
  
  text-align: center;
  div { 
    display: inline-block;
  }

  a {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
    background: #fff;
    color: black;
    float: left;
    padding: 8px 16px;
    text-decoration: none;
    transition: background-color .3s;
    border: 1px solid #ddd;
    margin: 0 4px;
    box-shadow: rgba(39, 44, 49, 0.06) 8px 14px 38px, rgba(39, 44, 49, 0.03) 1px 3px 8px;

    &:first-child {
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
    }

    &:last-child {
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }

    &.active {
      background-color: #4CAF50;
      color: white;
      border: 1px solid #4CAF50;
    }

    &:hover:not(.active) {
      background-color: #ddd;
    }

  }
`

const Pagination: React.FunctionComponent<PaginationProps> = ({currentPage, numPages}) => {
  const isFirst = currentPage === 1;
  const isLast = currentPage === numPages;
  const prevPage = currentPage - 1 === 1 ? "/" : (currentPage - 1).toString();
  const nextPage = (currentPage + 1).toString();
  return (
    <nav css={navCss}>
      <div>
        {!isFirst && (
            <Link to={prevPage} rel="prev">
              ← Previous Page
            </Link>
        )}

        {Array.from({ length: numPages }, (_, i) => (
            <Link key={`pagination-number${i + 1}`} to={`/${i === 0 ? "" : i + 1}`}>
              {i + 1}
            </Link>
        ))}
        
        {!isLast && (
            <Link to={nextPage} rel="next">
              Next Page →
            </Link>
        )}
      </div>
    </nav>
  );
};

export default Pagination;

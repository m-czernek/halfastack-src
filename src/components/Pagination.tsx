import { Link } from 'gatsby';
import { setLightness } from 'polished';
import * as React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';

import { colors } from '../styles/colors';
import { outer, inner } from '../styles/shared';
import config from '../website-config';

export interface PaginationProps {
  currentPage: number;
  numPages: number;
}


const Pagination: React.FunctionComponent<PaginationProps> = ({currentPage, numPages}) => {
  const isFirst = currentPage === 1;
  const isLast = currentPage === numPages;
  const prevPage = currentPage - 1 === 1 ? "/" : (currentPage - 1).toString();
  const nextPage = (currentPage + 1).toString();
  return (
    Array.from({ length: numPages }, (_, i) => (
      <Link key={`pagination-number${i + 1}`} to={`/${i === 0 ? "" : i + 1}`}>
        {i + 1}
      </Link>
    ))
  );
};

export default Pagination;
